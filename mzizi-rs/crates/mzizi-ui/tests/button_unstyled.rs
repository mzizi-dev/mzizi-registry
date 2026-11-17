//! The Rust button emits structure, state and ARIA only (issue #708): no class attribute
//! at all, unless the adopter passes one. Rendered with `dioxus-ssr`, the same path the
//! goldens use, so the markup a browser receives is what is asserted.

use dioxus::prelude::*;
use mzizi_ui::{Button, ButtonSize, ButtonVariant};

fn render(variant: ButtonVariant, size: ButtonSize, disabled: bool, class: &str) -> String {
    let class = class.to_owned();
    dioxus_ssr::render_element(rsx! {
        Button { variant, size, disabled, class, "Save" }
    })
}

#[test]
fn no_variant_or_size_emits_a_class_attribute() {
    for variant in [
        ButtonVariant::Default,
        ButtonVariant::Outline,
        ButtonVariant::Secondary,
        ButtonVariant::Ghost,
        ButtonVariant::Destructive,
        ButtonVariant::Link,
    ] {
        for size in [
            ButtonSize::Default,
            ButtonSize::Sm,
            ButtonSize::Lg,
            ButtonSize::Icon,
            ButtonSize::IconSm,
        ] {
            let html = render(variant, size, false, "");
            assert!(
                !html.contains("class="),
                "{}/{} rendered a class: {html}",
                variant.slug(),
                size.slug()
            );
            assert!(
                html.contains(&format!("data-variant=\"{}\"", variant.slug())),
                "{html}"
            );
            assert!(
                html.contains(&format!("data-size=\"{}\"", size.slug())),
                "{html}"
            );
            assert!(html.contains("data-slot=\"button\""), "{html}");
        }
    }
}

#[test]
fn state_is_mirrored_to_data_state() {
    assert!(
        render(ButtonVariant::Default, ButtonSize::Default, false, "")
            .contains("data-state=\"enabled\"")
    );
    let disabled = render(ButtonVariant::Default, ButtonSize::Default, true, "");
    assert!(disabled.contains("data-state=\"disabled\""), "{disabled}");
    assert!(disabled.contains("disabled"), "{disabled}");
}

#[test]
fn the_adopters_class_passes_through_and_nothing_else_is_added() {
    let html = render(ButtonVariant::Outline, ButtonSize::Sm, false, "w-full mt-2");
    assert!(html.contains("class=\"w-full mt-2\""), "{html}");
    assert_eq!(html.matches("class=").count(), 1, "{html}");
}
